import { useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { AnimalForm } from '../../../../telas/AnimalForm.jsx'
import { Page } from '../../../../componentes/Page.jsx'
import { estilosForm } from '../../../../componentes/ResourceForm.jsx'
import { useToast } from '../../../../web/hooks/useToast.js'
import { dataService } from '../../../../web/services/dataService.js'
import { sombras } from '../../../../tema.js'

export default function NovoAnimal() {
  const router = useRouter()
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  const cadastrar = async (payload) => {
    setSaving(true)
    try {
      const animal = await dataService.create('animais', payload)
      toast.success(`${animal.nome} foi cadastrado(a) para adoção!`)
      router.dismissTo('/admin/adocoes')
    } catch (err) {
      toast.error(err.message)
      setSaving(false)
    }
  }

  return (
    <Page title="Novo animal para adoção" subtitle="Preencha a ficha do animal que vai para o catálogo.">
      <View style={[estilosForm.cartao, sombras.suave]}>
        <AnimalForm
          onSubmit={cadastrar}
          onCancel={() => (router.canGoBack() ? router.back() : router.replace('/admin/adocoes'))}
          saving={saving}
          submitLabel="Cadastrar animal"
        />
      </View>
    </Page>
  )
}
